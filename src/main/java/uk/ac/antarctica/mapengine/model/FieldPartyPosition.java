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
            setFix_date(new SimpleDateFormat("yyyy-MM-dd").parse((String) getJsonElement(jo, "fix_date", false, "")));
        } catch (ParseException ex) {
            setFix_date(new Date());
        }
        setPeople_count((int) getJsonElement(jo, "people_count", true, 0, Integer.class));
        setUpdater((String) getJsonElement(jo, "updater", false, ""));
        setLat((double) getJsonElement(jo, "lat", false, 0.0, Double.class));
        setLon((double) getJsonElement(jo, "lon", false, 0.0, Double.class));
        setHeight((double) getJsonElement(jo, "height", true, 0.0, Double.class));
        setNotes((String) getJsonElement(jo, "notes", true, ""));        
    }

    @Override
    public String insertSql() {
        return ("INSERT INTO " + getTableName() + " "
                + "(sledge, season, fix_date, updated, people_count, updater, lat, lon, height, notes) "
                + "VALUES(?,?,?,current_timestamp,?,?,?,?,?,?)");
    }

    @Override
    public Object[] insertArgs() {
        return (new Object[]{
            getSledge(),
            getSeason(),
            getFix_date(),
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
                + "fix_date=?, "
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
        return (new Object[]{
            getSledge(),
            getSeason(),
            getFix_date(),
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
