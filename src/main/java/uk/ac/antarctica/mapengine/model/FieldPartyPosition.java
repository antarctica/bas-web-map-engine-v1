/*
 * Field Party position
 */
package uk.ac.antarctica.mapengine.model;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import org.hibernate.validator.constraints.NotEmpty;
import uk.ac.antarctica.mapengine.validator.Latitude;
import uk.ac.antarctica.mapengine.validator.Longitude;

public class FieldPartyPosition extends JsonCrudApp {    
    
    @NotEmpty
    private int id;
    @NotEmpty
    @Size(min = 1, max = 20)
    private String sledge;
    @Pattern(regexp = "[0-9]{4}")
    private String season;
    @NotNull
    private Date fix_date;
    private Date updated;
    private int people_count;
    @NotEmpty
    @Size(min = 1, max = 10)
    private String updater;
    @Latitude
    private double lat;
    @Longitude
    private double lon;
    private double height;
    private String notes;
    
    private String tableName;

    public FieldPartyPosition(String tableName) {
        this.tableName = tableName;
    }
    
    @Override
    public void fromPayload(String payload, String username) {
        JsonElement je = new JsonParser().parse(payload);
        JsonObject jo = je.getAsJsonObject();
        setId((int) getJsonElement(jo, "id", false, 0, Integer.class));
        setSledge((String) getJsonElement(jo, "sledge", false, ""));
        setSeason((String) getJsonElement(jo, "season", false, "1819"));
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
            Date fd = sdf.parse((String) getJsonElement(jo, "fix_date", false, ""));
            System.out.println("Parsed fix date as : " + fd.toString());
            setFix_date(fd);
        } catch (ParseException ex) {
            System.out.println("Parse exception : " + ex.getMessage() + " making sense of fix date");
            setFix_date(new Date());
        }
        setPeople_count((int) getJsonElement(jo, "people_count", true, 0, Integer.class));
        setUpdater((String) getJsonElement(jo, "updater", false, ""));
        setLat((double) getJsonElement(jo, "lat", false, 0.0, Double.class));
        setLon((double) getJsonElement(jo, "lon", false, 0.0, Double.class));
        setHeight((double) getJsonElement(jo, "height", true, 0.0, Double.class));
        setNotes((String) getJsonElement(jo, "notes", true, ""));  
        System.out.println(this.toString());
    }
    
    @Override
    public String toString() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        StringBuilder sb = new StringBuilder();
        sb
            .append("--- Field Party Position ---").append("\n")
            .append("id : ").append(getId()).append("\n")
            .append("sledge : ").append(getSledge()).append("\n")
            .append("season : ").append(getSeason()).append("\n")
            .append("fix_date : ").append(sdf.format(getFix_date())).append("\n")
            .append("updated : ").append(getUpdated()).append("\n")
            .append("people_count : ").append(getPeople_count()).append("\n")
            .append("updater : ").append(getUpdater()).append("\n")
            .append("lat : ").append(getLat()).append("\n")
            .append("lon : ").append(getLon()).append("\n")
            .append("height : ").append(getHeight()).append("\n")
            .append("notes : ").append(getNotes()).append("\n")
            .append("--- End Field Party Position ---").append("\n");
        return(sb.toString());
    }

    @Override
    public String insertSql() {
        return ("INSERT INTO " + getTableName() + " "
                + "(sledge, season, fix_date, updated, people_count, updater, lat, lon, height, notes) "
                + "VALUES(?,?,to_date(?, 'YYYY-MM-DD'),current_timestamp,?,?,?,?,?,?)");
    }

    @Override
    public Object[] insertArgs() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return (new Object[]{
            getSledge(),
            getSeason(),
            sdf.format(getFix_date()),
            getPeople_count(),
            getUpdater(),
            getLat(),
            getLon(),
            getHeight(),
            getNotes()
        });
    }

    @Override
    public String updateSql() {
        return ("UPDATE " + getTableName() + " SET "
                + "sledge=?, "
                + "season=?, "
                + "fix_date=to_date(?, 'YYYY-MM-DD'), "
                + "updated=current_timestamp, "
                + "people_count=?, "
                + "updater=?, "
                + "lat=?, "
                + "lon=?, "
                + "height=?, "
                + "notes=? "               
                + "WHERE id=?");
    }

    @Override
    public Object[] updateArgs(Object id) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        return (new Object[]{
            getSledge(),
            getSeason(),
            sdf.format(getFix_date()),
            getPeople_count(),
            getUpdater(),
            getLat(),
            getLon(),
            getHeight(),
            getNotes(),
            id
        });
    }

    @Override
    public String deleteSql() {
        return ("DELETE FROM " + getTableName() + " WHERE id=?");
    }

    @Override
    public Object[] deleteArgs(Object id) {
        return (new Object[]{id});
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getSledge() {
        return sledge;
    }

    public void setSledge(String sledge) {
        this.sledge = sledge;
    }

    public String getSeason() {
        return season;
    }

    public void setSeason(String season) {
        this.season = season;
    }

    public Date getFix_date() {
        return fix_date;
    }

    public void setFix_date(Date fix_date) {
        this.fix_date = fix_date;
    }

    public Date getUpdated() {
        return updated;
    }

    public void setUpdated(Date updated) {
        this.updated = updated;
    }

    public int getPeople_count() {
        return people_count;
    }

    public void setPeople_count(int people_count) {
        this.people_count = people_count;
    }

    public String getUpdater() {
        return updater;
    }

    public void setUpdater(String updater) {
        this.updater = updater;
    }

    public double getLat() {
        return lat;
    }

    public void setLat(double lat) {
        this.lat = lat;
    }

    public double getLon() {
        return lon;
    }

    public void setLon(double lon) {
        this.lon = lon;
    }

    public double getHeight() {
        return height;
    }

    public void setHeight(double height) {
        this.height = height;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getTableName() {
        return tableName;
    }

    public void setTableName(String tableName) {
        this.tableName = tableName;
    }
    
}
